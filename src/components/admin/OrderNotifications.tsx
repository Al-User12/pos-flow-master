import { useEffect, useState } from 'react';
import { Bell, Package, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'new_order' | 'new_payment';
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  timestamp: Date;
  read: boolean;
}

export function OrderNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('New order received:', payload);
          const newOrder = payload.new as any;
          
          // Fetch buyer info
          const { data: buyer } = await supabase
            .from('buyer_profiles')
            .select('full_name')
            .eq('id', newOrder.buyer_id)
            .single();
          
          const notification: Notification = {
            id: `order-${newOrder.id}`,
            type: 'new_order',
            title: 'Pesanan Baru!',
            message: `${buyer?.full_name || 'Buyer'} membuat pesanan ${newOrder.order_number}`,
            orderId: newOrder.id,
            orderNumber: newOrder.order_number,
            timestamp: new Date(),
            read: false,
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 50));
          
          // Show toast notification
          toast.info('Pesanan Baru!', {
            description: notification.message,
            action: {
              label: 'Lihat',
              onClick: () => navigate('/admin/orders'),
            },
          });
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
      )
      .subscribe();

    // Subscribe to new payment confirmations
    const paymentsChannel = supabase
      .channel('admin-payments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_confirmations',
        },
        async (payload) => {
          console.log('New payment received:', payload);
          const newPayment = payload.new as any;
          
          // Fetch order info
          const { data: order } = await supabase
            .from('orders')
            .select('order_number, buyer_id, buyer_profiles(full_name)')
            .eq('id', newPayment.order_id)
            .single();
          
          const notification: Notification = {
            id: `payment-${newPayment.id}`,
            type: 'new_payment',
            title: 'Bukti Pembayaran Baru!',
            message: `${(order?.buyer_profiles as any)?.full_name || 'Buyer'} mengunggah bukti pembayaran untuk ${order?.order_number}`,
            orderId: newPayment.order_id,
            orderNumber: order?.order_number || '',
            timestamp: new Date(),
            read: false,
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 50));
          
          // Show toast notification
          toast.info('Bukti Pembayaran Baru!', {
            description: notification.message,
            action: {
              label: 'Konfirmasi',
              onClick: () => navigate('/admin/payments'),
            },
          });
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [queryClient, navigate]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    
    if (notification.type === 'new_order') {
      navigate('/admin/orders');
    } else if (notification.type === 'new_payment') {
      navigate('/admin/payments');
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifikasi</h4>
          <div className="flex gap-1">
            {notifications.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Tandai Dibaca
                </Button>
                <Button variant="ghost" size="icon" onClick={clearAll}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-full ${
                      notification.type === 'new_order' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {notification.type === 'new_order' ? (
                        <Package className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

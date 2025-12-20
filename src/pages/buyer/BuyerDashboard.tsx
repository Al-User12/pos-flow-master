import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  Wallet, 
  User,
  Gift,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { user, profileId } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['buyer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('id, full_name, commission_balance, commission_pending')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['buyer-recent-orders', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

  const { data: orderStats } = useQuery({
    queryKey: ['buyer-order-stats', profileId],
    queryFn: async () => {
      if (!profileId) return { active: 0, completed: 0 };
      
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('buyer_id', profileId);
      
      if (error) throw error;
      
      const active = data?.filter(o => 
        ['new', 'waiting_payment', 'paid', 'assigned', 'picked_up', 'on_delivery'].includes(o.status)
      ).length || 0;
      
      const completed = data?.filter(o => o.status === 'delivered').length || 0;
      
      return { active, completed };
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

  const copyReferralCode = () => {
    if (profile?.id) {
      const referralCode = profile.id.substring(0, 8).toUpperCase();
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: 'Tersalin!',
        description: 'Kode referral berhasil disalin',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    new: { label: 'Baru', color: 'bg-blue-50 text-blue-700' },
    waiting_payment: { label: 'Menunggu Bayar', color: 'bg-amber-50 text-amber-700' },
    paid: { label: 'Dibayar', color: 'bg-green-50 text-green-700' },
    assigned: { label: 'Proses', color: 'bg-purple-50 text-purple-700' },
    picked_up: { label: 'Diambil', color: 'bg-indigo-50 text-indigo-700' },
    on_delivery: { label: 'Dikirim', color: 'bg-orange-50 text-orange-700' },
    delivered: { label: 'Selesai', color: 'bg-green-50 text-green-700' },
    cancelled: { label: 'Batal', color: 'bg-red-50 text-red-700' },
  };

  const quickActions = [
    { 
      icon: ShoppingBag, 
      label: 'Katalog', 
      description: 'Lihat produk',
      href: '/buyer/catalog',
      color: 'from-primary/20 to-primary/10',
      iconColor: 'text-primary'
    },
    { 
      icon: Package, 
      label: 'Pesanan', 
      description: 'Lacak pesanan',
      href: '/buyer/orders',
      color: 'from-amber-100 to-amber-50',
      iconColor: 'text-amber-600'
    },
    { 
      icon: Wallet, 
      label: 'Komisi', 
      description: 'Lihat saldo',
      href: '/buyer/profile',
      color: 'from-green-100 to-green-50',
      iconColor: 'text-green-600'
    },
    { 
      icon: User, 
      label: 'Profil', 
      description: 'Edit data',
      href: '/buyer/profile',
      color: 'from-blue-100 to-blue-50',
      iconColor: 'text-blue-600'
    },
  ];

  return (
    <BuyerLayout>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Halo, {profile?.full_name?.split(' ')[0] || 'Pembeli'}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang di Osher Shop
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Saldo Komisi</span>
            </div>
            {profileLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold text-primary">
                {formatPrice(profile?.commission_balance || 0)}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Pesanan Aktif</span>
            </div>
            {ordersLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-lg font-bold text-amber-600">
                {orderStats?.active || 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Card */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Kode Referral Anda</p>
                <code className="font-mono font-bold text-primary">
                  {profile?.id?.substring(0, 8).toUpperCase() || '--------'}
                </code>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralCode}
              className="gap-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin' : 'Salin'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        Menu Cepat
      </h2>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.href}>
            <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
              <CardContent className="p-3 text-center">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2",
                  action.color
                )}>
                  <action.icon className={cn("w-5 h-5", action.iconColor)} />
                </div>
                <p className="text-xs font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pesanan Terbaru
        </h2>
        <Link to="/buyer/orders">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            Lihat Semua
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
      
      {ordersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recentOrders?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada pesanan</p>
            <Link to="/buyer/catalog">
              <Button variant="link" size="sm" className="mt-2">
                Mulai Belanja
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentOrders?.map((order) => {
            const status = statusConfig[order.status] || statusConfig.new;
            return (
              <Link key={order.id} to={`/buyer/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-all hover:border-primary/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-medium">{order.order_number}</p>
                        <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                      </div>
                      <Badge className={cn("border-0", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
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

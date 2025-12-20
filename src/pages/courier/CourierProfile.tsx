import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Truck, Phone, LogOut, Settings, Award, TrendingUp, Calendar, ChevronRight, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useCourierProfile } from '@/hooks/useCourier';
import { useCourierStats } from '@/hooks/useCourierData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function CourierProfile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCourierProfile();
  const { data: stats, isLoading: statsLoading } = useCourierStats();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleActive = async () => {
    if (!profile || isUpdating) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('courier_profiles')
        .update({ is_active: !profile.is_active })
        .eq('id', profile.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['courier-profile'] });
      toast.success(
        profile.is_active ? 'Status: Tidak Aktif' : 'Status: Aktif',
        { description: profile.is_active 
          ? 'Anda tidak akan menerima order baru' 
          : 'Anda siap menerima order' 
        }
      );
    } catch (error: any) {
      toast.error('Gagal mengubah status', { description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Berhasil logout', { description: 'Sampai jumpa kembali!' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (profileLoading) {
    return (
      <CourierLayout>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </CourierLayout>
    );
  }

  return (
    <CourierLayout>
      {/* Profile Header Card */}
      <Card className="mb-4 overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-secondary to-secondary/80 p-6 text-secondary-foreground">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-background/20 flex items-center justify-center ring-4 ring-background/30">
              <User className="w-10 h-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-xl truncate">{profile?.full_name || 'Kurir'}</h2>
                {profile?.is_active && (
                  <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                    Aktif
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{profile?.phone}</span>
                </div>
                {profile?.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>{profile.vehicle_type} • {profile.vehicle_plate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-muted/50">
              <Award className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile?.total_deliveries || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <TrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats?.deliveredMonth || 0}</p>
              <p className="text-xs text-muted-foreground">Bulan Ini</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <Calendar className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats?.deliveredToday || 0}</p>
              <p className="text-xs text-muted-foreground">Hari Ini</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Toggle */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div 
            className={cn(
              "flex items-center justify-between p-4 rounded-xl transition-colors",
              profile?.is_active ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                profile?.is_active ? "bg-green-100 dark:bg-green-900/50" : "bg-muted"
              )}>
                <Shield className={cn(
                  "w-5 h-5",
                  profile?.is_active ? "text-green-600" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Status Ketersediaan</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.is_active ? 'Siap menerima order baru' : 'Tidak menerima order'}
                </p>
              </div>
            </div>
            <Switch
              checked={profile?.is_active}
              onCheckedChange={handleToggleActive}
              disabled={isUpdating}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <span className="text-muted-foreground">Bergabung Sejak</span>
              <span className="font-medium">{profile?.created_at ? formatDate(profile.created_at) : '-'}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-muted-foreground">ID Kurir</span>
              <span className="font-mono text-sm">{profile?.id?.slice(0, 8) || '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Keluar dari Akun
      </Button>
    </CourierLayout>
  );
}

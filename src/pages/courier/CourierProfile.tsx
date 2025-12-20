import { useNavigate } from 'react-router-dom';
import { User, Truck, Phone, LogOut, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useCourierProfile } from '@/hooks/useCourier';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function CourierProfile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useCourierProfile();
  const queryClient = useQueryClient();

  const handleToggleActive = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('courier_profiles')
        .update({ is_active: !profile.is_active })
        .eq('id', profile.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['courier-profile'] });
      toast({
        title: profile.is_active ? 'Status: Tidak Aktif' : 'Status: Aktif',
        description: profile.is_active 
          ? 'Anda tidak akan menerima order baru' 
          : 'Anda siap menerima order',
      });
    } catch (error: any) {
      toast({
        title: 'Gagal mengubah status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Berhasil logout',
      description: 'Sampai jumpa kembali!',
    });
  };

  return (
    <CourierLayout>
      {/* Profile Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">{profile?.full_name || 'Kurir'}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                {profile?.phone}
              </div>
              {profile?.vehicle_type && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="w-3 h-3" />
                  {profile.vehicle_type} - {profile.vehicle_plate}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-4 bg-secondary text-secondary-foreground">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{profile?.total_deliveries || 0}</p>
              <p className="text-sm opacity-80">Total Pengiriman</p>
            </div>
            <div>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm opacity-80">Bulan Ini</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Status Aktif</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.is_active ? 'Siap menerima order' : 'Tidak menerima order'}
                </p>
              </div>
            </div>
            <Switch
              checked={profile?.is_active}
              onCheckedChange={handleToggleActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>
    </CourierLayout>
  );
}

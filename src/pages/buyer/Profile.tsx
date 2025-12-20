import { useNavigate } from 'react-router-dom';
import { User, MapPin, Wallet, Gift, LogOut, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function BuyerProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['buyer-profile-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select(`
          *,
          domiciles:domicile_id (name),
          banks:bank_id (name)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Berhasil logout',
      description: 'Sampai jumpa kembali!',
    });
  };

  const menuItems = [
    { icon: User, label: 'Edit Profil', onClick: () => {} },
    { icon: MapPin, label: 'Alamat Tersimpan', onClick: () => {} },
    { icon: Gift, label: 'Referral Saya', onClick: () => {} },
  ];

  return (
    <BuyerLayout>
      {/* Profile Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.phone && (
                <p className="text-sm text-muted-foreground">{profile.phone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Balance */}
      <Card className="mb-4 bg-gradient-to-br from-primary to-primary-600 text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Saldo Komisi</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-80">Tersedia</p>
              <p className="text-xl font-bold">
                {formatPrice(profile?.commission_balance || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-80">Tertahan</p>
              <p className="text-xl font-bold">
                {formatPrice(profile?.commission_pending || 0)}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-4"
            disabled={(profile?.commission_balance || 0) <= 0}
          >
            Tarik Saldo
          </Button>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card className="mb-4">
        <CardContent className="p-0">
          {menuItems.map((item, index) => (
            <div key={item.label}>
              <button
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              {index < menuItems.length - 1 && <Separator />}
            </div>
          ))}
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
    </BuyerLayout>
  );
}

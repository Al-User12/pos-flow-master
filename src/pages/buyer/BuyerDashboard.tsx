import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  Wallet, 
  LogOut, 
  User,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface BuyerProfile {
  id: string;
  full_name: string;
  commission_balance: number;
  commission_pending: number;
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading, role, profileId } = useAuth();
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && role && role !== 'buyer') {
      // Redirect to appropriate dashboard
      if (role === 'courier') navigate('/courier');
      else if (['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) navigate('/admin');
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    if (!profileId) return;
    
    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('id, full_name, commission_balance, commission_pending')
      .eq('id', profileId)
      .single();

    if (data && !error) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const copyReferralCode = () => {
    if (profile?.id) {
      const referralCode = profile.id.substring(0, 8).toUpperCase();
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Kode referral disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RetailPOS</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              Halo, {profile?.full_name || 'Pembeli'}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Selamat Datang, {profile?.full_name?.split(' ')[0] || 'Pembeli'}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Kelola pesanan dan lihat saldo komisi Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Komisi</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(profile?.commission_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tersedia untuk ditarik
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Komisi Tertahan</CardTitle>
              <Package className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(profile?.commission_pending || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Menunggu konfirmasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kode Referral</CardTitle>
              <Gift className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="text-lg font-bold text-foreground bg-muted px-2 py-1 rounded">
                  {profile?.id?.substring(0, 8).toUpperCase() || '--------'}
                </code>
                <Button variant="ghost" size="icon" onClick={copyReferralCode}>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bagikan untuk dapat komisi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
                <ShoppingBag className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Katalog Produk</CardTitle>
              <CardDescription>Lihat dan belanja produk</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-warning" />
              </div>
              <CardTitle className="text-lg">Pesanan Saya</CardTitle>
              <CardDescription>Lihat status pesanan Anda</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Komisi Saya</CardTitle>
              <CardDescription>Kelola saldo komisi</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-2">
                <User className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-lg">Profil Saya</CardTitle>
              <CardDescription>Edit data diri Anda</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Placeholder for coming features */}
        <div className="mt-12 text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Fitur Segera Hadir</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Katalog produk, keranjang belanja, checkout, dan pelacakan pesanan akan segera tersedia
          </p>
        </div>
      </main>
    </div>
  );
}

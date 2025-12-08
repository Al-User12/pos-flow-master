import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, Shield } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { BuyerRegistrationForm } from '@/components/auth/BuyerRegistrationForm';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      // Redirect based on role
      if (role === 'buyer') {
        navigate('/buyer');
      } else if (role === 'courier') {
        navigate('/courier');
      } else if (['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, role, navigate]);

  const handleSuccess = () => {
    // Auth state change will trigger the redirect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">RetailPOS</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
              Belanja Mudah,<br />Pengiriman Cepat
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              Platform belanja retail terpercaya dengan sistem referral yang menguntungkan
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Produk Berkualitas</h3>
                <p className="text-sm text-primary-foreground/70">Pilihan produk retail terlengkap</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Pengiriman Cepat</h3>
                <p className="text-sm text-primary-foreground/70">Kurir profesional siap antar pesanan</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Komisi Referral</h3>
                <p className="text-sm text-primary-foreground/70">Dapatkan komisi dari setiap referral</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2024 RetailPOS. All rights reserved.
        </p>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">RetailPOS</span>
          </div>

          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setMode('register')}
            />
          ) : (
            <BuyerRegistrationForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

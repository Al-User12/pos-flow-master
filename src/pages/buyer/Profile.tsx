import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Wallet, 
  Gift, 
  LogOut, 
  ChevronRight, 
  Edit, 
  Phone, 
  Mail, 
  CreditCard,
  ArrowDownToLine,
  History,
  Copy,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BuyerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut, profileId } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    domicile_id: '',
    bank_id: '',
    bank_account_name: '',
    bank_account_number: '',
  });
  
  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState('');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['buyer-profile-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select(`
          *,
          domiciles:domicile_id (id, name, city),
          banks:bank_id (id, name)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: domiciles } = useQuery({
    queryKey: ['domiciles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domiciles')
        .select('id, name, city')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['referral-commissions', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('referral_commissions')
        .select(`
          *,
          buyer:buyer_id (full_name),
          orders:order_id (order_number)
        `)
        .eq('referrer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

  const { data: payoutRequests, isLoading: payoutsLoading } = useQuery({
    queryKey: ['payout-requests', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        domicile_id: profile.domicile_id || '',
        bank_id: profile.bank_id || '',
        bank_account_name: profile.bank_account_name || '',
        bank_account_number: profile.bank_account_number || '',
      });
    }
  }, [profile]);

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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Berhasil logout',
      description: 'Sampai jumpa kembali!',
    });
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      toast({
        title: 'Tersalin!',
        description: 'Kode referral berhasil disalin',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('buyer_profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          domicile_id: editForm.domicile_id || null,
          bank_id: editForm.bank_id || null,
          bank_account_name: editForm.bank_account_name || null,
          bank_account_number: editForm.bank_account_number || null,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Profil diperbarui',
        description: 'Data profil Anda berhasil disimpan',
      });
      
      queryClient.invalidateQueries({ queryKey: ['buyer-profile-full'] });
      setIsEditOpen(false);
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!profileId || !profile) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Jumlah tidak valid',
        description: 'Masukkan jumlah yang valid',
        variant: 'destructive',
      });
      return;
    }

    if (amount > (profile.commission_balance || 0)) {
      toast({
        title: 'Saldo tidak cukup',
        description: 'Jumlah melebihi saldo tersedia',
        variant: 'destructive',
      });
      return;
    }

    if (!profile.bank_id || !profile.bank_account_number || !profile.bank_account_name) {
      toast({
        title: 'Data bank belum lengkap',
        description: 'Lengkapi data bank di profil Anda terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const bankName = banks?.find(b => b.id === profile.bank_id)?.name || '';
      
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          buyer_id: profileId,
          amount,
          bank_name: bankName,
          account_number: profile.bank_account_number,
          account_name: profile.bank_account_name,
        });

      if (error) throw error;

      toast({
        title: 'Permintaan dikirim',
        description: 'Permintaan penarikan sedang diproses',
      });
      
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-profile-full'] });
      setPayoutAmount('');
      setIsPayoutOpen(false);
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim permintaan',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCommissionTypeLabel = (type: string) => {
    switch (type) {
      case 'accrual': return 'Komisi';
      case 'reversal': return 'Pembatalan';
      case 'payout': return 'Penarikan';
      default: return type;
    }
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-amber-50 text-amber-700">Menunggu</Badge>;
      case 'approved': return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Disetujui</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-50 text-green-700">Selesai</Badge>;
      case 'rejected': return <Badge variant="secondary" className="bg-red-50 text-red-700">Ditolak</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <BuyerLayout>
      {/* Profile Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-lg text-foreground">{profile?.full_name || 'User'}</h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
                <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Edit Profil</SheetTitle>
                      <SheetDescription>
                        Perbarui informasi profil Anda
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label>Nama Lengkap</Label>
                        <Input
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          placeholder="Nama lengkap"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No. Telepon</Label>
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Domisili</Label>
                        <Select
                          value={editForm.domicile_id}
                          onValueChange={(value) => setEditForm({ ...editForm, domicile_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih domisili" />
                          </SelectTrigger>
                          <SelectContent>
                            {domiciles?.map((dom) => (
                              <SelectItem key={dom.id} value={dom.id}>
                                {dom.name} {dom.city && `- ${dom.city}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Separator className="my-4" />
                      <h4 className="font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Informasi Bank
                      </h4>
                      
                      <div className="space-y-2">
                        <Label>Bank</Label>
                        <Select
                          value={editForm.bank_id}
                          onValueChange={(value) => setEditForm({ ...editForm, bank_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks?.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>No. Rekening</Label>
                        <Input
                          value={editForm.bank_account_number}
                          onChange={(e) => setEditForm({ ...editForm, bank_account_number: e.target.value })}
                          placeholder="Nomor rekening"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Pemilik Rekening</Label>
                        <Input
                          value={editForm.bank_account_name}
                          onChange={(e) => setEditForm({ ...editForm, bank_account_name: e.target.value })}
                          placeholder="Nama sesuai rekening"
                        />
                      </div>

                      <Button 
                        className="w-full mt-6" 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan Perubahan'
                        )}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              {/* Referral Code */}
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
                  <Gift className="w-3 h-3" />
                  Kode Referral
                </Badge>
                <code className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">
                  {profile?.referral_code || '--------'}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyReferralCode}
                >
                  {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Balance */}
      <Card className="mb-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
        <CardContent className="p-4 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Saldo Komisi</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs opacity-80">Tersedia</p>
                <p className="text-2xl font-bold">
                  {formatPrice(profile?.commission_balance || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-80">Tertahan</p>
                <p className="text-2xl font-bold">
                  {formatPrice(profile?.commission_pending || 0)}
                </p>
              </div>
            </div>
            
            <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  disabled={(profile?.commission_balance || 0) <= 0}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Tarik Saldo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tarik Saldo Komisi</DialogTitle>
                  <DialogDescription>
                    Saldo tersedia: {formatPrice(profile?.commission_balance || 0)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Jumlah Penarikan</Label>
                    <Input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Masukkan jumlah"
                    />
                  </div>
                  {profile?.bank_id && profile?.bank_account_number && (
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="font-medium">Transfer ke:</p>
                      <p className="text-muted-foreground">
                        {banks?.find(b => b.id === profile.bank_id)?.name} - {profile.bank_account_number}
                      </p>
                      <p className="text-muted-foreground">a.n. {profile.bank_account_name}</p>
                    </div>
                  )}
                  {(!profile?.bank_id || !profile?.bank_account_number) && (
                    <p className="text-sm text-destructive">
                      Lengkapi data bank di profil Anda terlebih dahulu
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPayoutOpen(false)}>Batal</Button>
                  <Button onClick={handleRequestPayout} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Ajukan Penarikan'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Commission History & Payout History */}
      <Tabs defaultValue="commissions" className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="commissions" className="flex-1 gap-1">
            <History className="w-4 h-4" />
            Riwayat Komisi
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1 gap-1">
            <ArrowDownToLine className="w-4 h-4" />
            Penarikan
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="commissions" className="mt-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Riwayat Komisi Referral</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {commissionsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Memuat...</div>
              ) : commissions?.length === 0 ? (
                <div className="p-8 text-center">
                  <Gift className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Belum ada komisi referral</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bagikan kode referral Anda untuk mendapatkan komisi
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {commissions?.map((commission: any) => (
                    <div key={commission.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {getCommissionTypeLabel(commission.commission_type)}
                          {commission.buyer?.full_name && (
                            <span className="text-muted-foreground font-normal">
                              {' '}dari {commission.buyer.full_name}
                            </span>
                          )}
                        </p>
                        {commission.orders?.order_number && (
                          <p className="text-xs text-muted-foreground">
                            Order: {commission.orders.order_number}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(commission.created_at)}
                        </p>
                      </div>
                      <span className={cn(
                        "font-bold",
                        commission.commission_type === 'accrual' ? 'text-primary' : 'text-destructive'
                      )}>
                        {commission.commission_type === 'accrual' ? '+' : '-'}
                        {formatPrice(commission.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Riwayat Penarikan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payoutsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Memuat...</div>
              ) : payoutRequests?.length === 0 ? (
                <div className="p-8 text-center">
                  <ArrowDownToLine className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Belum ada penarikan</p>
                </div>
              ) : (
                <div className="divide-y">
                  {payoutRequests?.map((payout: any) => (
                    <div key={payout.id} className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-foreground">
                          {formatPrice(payout.amount)}
                        </span>
                        {getPayoutStatusBadge(payout.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payout.bank_name} - {payout.account_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payout.created_at)}
                      </p>
                      {payout.rejection_reason && (
                        <p className="text-xs text-destructive mt-1">
                          Alasan: {payout.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

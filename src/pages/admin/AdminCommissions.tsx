import { useState } from 'react';
import { 
  useAdminCommissions, 
  useAdminPayouts, 
  useUpdatePayoutStatus 
} from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const commissionTypeLabels: Record<string, string> = {
  accrual: 'Pendapatan',
  reversal: 'Pembatalan',
  payout: 'Pencairan',
};

const commissionTypeColors: Record<string, string> = {
  accrual: 'bg-success text-success-foreground',
  reversal: 'bg-destructive text-destructive-foreground',
  payout: 'bg-info text-info-foreground',
};

const payoutStatusLabels: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  completed: 'Selesai',
};

const payoutStatusColors: Record<string, string> = {
  pending: 'bg-warning text-warning-foreground',
  approved: 'bg-info text-info-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  completed: 'bg-success text-success-foreground',
};

export default function AdminCommissions() {
  const { data: commissions, isLoading: commissionsLoading } = useAdminCommissions();
  const { data: payouts, isLoading: payoutsLoading } = useAdminPayouts();
  const updatePayoutStatus = useUpdatePayoutStatus();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<typeof payouts extends (infer T)[] | undefined ? T : never>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredCommissions = commissions?.filter(c =>
    c.referrer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayouts = payouts?.filter(p =>
    p.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.account_number.includes(searchQuery)
  );

  const handlePayoutAction = (payout: typeof payouts extends (infer T)[] | undefined ? T : never, action: 'approve' | 'reject' | 'complete') => {
    setSelectedPayout(payout);
    setActionType(action);
    setRejectionReason('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPayout) return;

    try {
      await updatePayoutStatus.mutateAsync({
        id: selectedPayout.id,
        status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'completed',
        rejection_reason: actionType === 'reject' ? rejectionReason : undefined,
      });
      toast.success(
        actionType === 'approve' ? 'Payout disetujui' :
        actionType === 'reject' ? 'Payout ditolak' :
        'Payout selesai diproses'
      );
      setActionDialogOpen(false);
    } catch (error) {
      toast.error('Gagal memproses payout');
    }
  };

  // Stats
  const totalCommissions = commissions?.filter(c => c.commission_type === 'accrual')
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const totalPayouts = payouts?.filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const pendingPayouts = payouts?.filter(p => p.status === 'pending').length || 0;
  const pendingPayoutAmount = payouts?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">Sepanjang waktu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dicairkan</CardTitle>
            <Wallet className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayouts)}</div>
            <p className="text-xs text-muted-foreground">Sudah dibayarkan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingPayouts}</div>
            <p className="text-xs text-muted-foreground">Menunggu approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Pending</CardTitle>
            <Wallet className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingPayoutAmount)}</div>
            <p className="text-xs text-muted-foreground">Perlu diproses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Permintaan Payout
            {pendingPayouts > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingPayouts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Riwayat Komisi
          </TabsTrigger>
        </TabsList>

        {/* Payout Requests Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Pencairan</CardTitle>
              <CardDescription>Kelola permintaan pencairan komisi dari pembeli</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, bank, nomor rekening..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {payoutsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pembeli</TableHead>
                        <TableHead>Rekening Tujuan</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Tidak ada permintaan payout
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayouts?.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{payout.buyer?.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{payout.bank_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {payout.account_number} - {payout.account_name}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold">{formatCurrency(Number(payout.amount))}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={payoutStatusColors[payout.status]}>
                                {payoutStatusLabels[payout.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(payout.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {payout.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-success hover:text-success"
                                      onClick={() => handlePayoutAction(payout, 'approve')}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handlePayoutAction(payout, 'reject')}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {payout.status === 'approved' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePayoutAction(payout, 'complete')}
                                  >
                                    Selesaikan
                                  </Button>
                                )}
                                {payout.status === 'rejected' && payout.rejection_reason && (
                                  <span className="text-xs text-muted-foreground max-w-[150px] truncate">
                                    {payout.rejection_reason}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission History Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Komisi</CardTitle>
              <CardDescription>Semua transaksi komisi referral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama referrer atau pembeli..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {commissionsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Pembeli</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">% Komisi</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommissions?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Tidak ada riwayat komisi
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCommissions?.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              <span className="font-medium">{commission.referrer?.full_name || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">{commission.buyer?.full_name || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {commission.commission_type === 'accrual' ? (
                                  <ArrowUpRight className="h-4 w-4 text-success" />
                                ) : commission.commission_type === 'reversal' ? (
                                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Wallet className="h-4 w-4 text-info" />
                                )}
                                <Badge className={commissionTypeColors[commission.commission_type]}>
                                  {commissionTypeLabels[commission.commission_type]}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold ${
                                commission.commission_type === 'accrual' ? 'text-success' : 
                                commission.commission_type === 'reversal' ? 'text-destructive' : ''
                              }`}>
                                {commission.commission_type === 'reversal' ? '-' : '+'}
                                {formatCurrency(Number(commission.amount))}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {commission.percentage ? (
                                <span className="text-muted-foreground">{commission.percentage}%</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Setujui Payout'}
              {actionType === 'reject' && 'Tolak Payout'}
              {actionType === 'complete' && 'Selesaikan Payout'}
            </DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Pembeli</span>
                  <span className="font-medium">{selectedPayout.buyer?.full_name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Bank</span>
                  <span>{selectedPayout.bank_name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">No. Rekening</span>
                  <span className="font-mono">{selectedPayout.account_number}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Nama Rekening</span>
                  <span>{selectedPayout.account_name}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-semibold text-lg">{formatCurrency(Number(selectedPayout.amount))}</span>
                </div>
              </div>

              {actionType === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alasan Penolakan</label>
                  <Textarea
                    placeholder="Masukkan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}

              {actionType === 'approve' && (
                <p className="text-sm text-muted-foreground">
                  Setelah disetujui, Anda perlu melakukan transfer manual ke rekening pembeli, 
                  lalu klik "Selesaikan" untuk menyelesaikan proses payout.
                </p>
              )}

              {actionType === 'complete' && (
                <p className="text-sm text-muted-foreground">
                  Pastikan Anda sudah melakukan transfer ke rekening pembeli sebelum menyelesaikan payout ini.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={updatePayoutStatus.isPending || (actionType === 'reject' && !rejectionReason)}
            >
              {updatePayoutStatus.isPending ? 'Memproses...' : 
                actionType === 'approve' ? 'Setujui' :
                actionType === 'reject' ? 'Tolak' :
                'Selesaikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

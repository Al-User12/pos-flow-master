import { useState } from 'react';
import { useAdminCustomers, useUpdateCustomer } from '@/hooks/useAdmin';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Users, UserCheck, Wallet, Phone, CreditCard, Building } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AdminCustomers() {
  const { data: customers, isLoading } = useAdminCustomers();
  const updateCustomer = useUpdateCustomer();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers extends (infer T)[] | undefined ? T : never>(null);

  const filteredCustomers = customers?.filter(customer =>
    customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.nik.includes(searchQuery)
  );

  const handleToggleVerified = async (customerId: string, isVerified: boolean) => {
    try {
      await updateCustomer.mutateAsync({ id: customerId, is_verified: !isVerified });
      toast.success(isVerified ? 'Verifikasi pelanggan dicabut' : 'Pelanggan terverifikasi');
    } catch (error) {
      toast.error('Gagal mengubah status verifikasi');
    }
  };

  const verifiedCustomers = customers?.filter(c => c.is_verified).length || 0;
  const totalCommissionBalance = customers?.reduce((sum, c) => sum + Number(c.commission_balance), 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terverifikasi</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{verifiedCustomers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saldo Komisi</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCommissionBalance)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pelanggan</CardTitle>
            <CardDescription>Kelola data pelanggan dan status verifikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, telepon, NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
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
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead className="text-right">Saldo Komisi</TableHead>
                      <TableHead className="text-center">Verifikasi</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada pelanggan ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers?.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Bergabung {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{customer.nik}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{formatCurrency(Number(customer.commission_balance))}</p>
                              {Number(customer.commission_pending) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Pending: {formatCurrency(Number(customer.commission_pending))}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={customer.is_verified}
                              onCheckedChange={() => handleToggleVerified(customer.id, customer.is_verified)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCustomer(customer)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Detail Pelanggan</DialogTitle>
                                </DialogHeader>
                                {selectedCustomer && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-8 w-8 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-lg">{selectedCustomer.full_name}</h3>
                                        <p className="text-muted-foreground">{selectedCustomer.phone || 'No phone'}</p>
                                        <Badge variant={selectedCustomer.is_verified ? 'default' : 'secondary'}>
                                          {selectedCustomer.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <CreditCard className="h-3 w-3" /> NIK
                                        </p>
                                        <p className="font-mono font-medium">{selectedCustomer.nik}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Domisili</p>
                                        <p className="font-medium">
                                          {selectedCustomer.domicile?.name || '-'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Saldo Komisi</p>
                                        <p className="font-medium text-success">
                                          {formatCurrency(Number(selectedCustomer.commission_balance))}
                                        </p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Komisi Pending</p>
                                        <p className="font-medium">
                                          {formatCurrency(Number(selectedCustomer.commission_pending))}
                                        </p>
                                      </div>
                                    </div>

                                    {selectedCustomer.bank && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Building className="h-3 w-3" /> Rekening Bank
                                        </p>
                                        <p className="font-medium">{selectedCustomer.bank.name}</p>
                                        <p className="text-sm">{selectedCustomer.bank_account_name}</p>
                                        <p className="text-sm font-mono">{selectedCustomer.bank_account_number}</p>
                                      </div>
                                    )}

                                    {selectedCustomer.referrer && selectedCustomer.referrer.length > 0 && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Direferensikan oleh</p>
                                        <p className="font-medium">{selectedCustomer.referrer[0]?.full_name}</p>
                                      </div>
                                    )}

                                    <div className="text-sm text-muted-foreground">
                                      Bergabung: {format(new Date(selectedCustomer.created_at), 'dd MMMM yyyy', { locale: idLocale })}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
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
      </div>
    </>
  );
}

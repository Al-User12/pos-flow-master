import { useState } from 'react';
import { useAdminCouriers, useUpdateCourier } from '@/hooks/useAdmin';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Truck, Phone, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AdminCouriers() {
  const { data: couriers, isLoading } = useAdminCouriers();
  const updateCourier = useUpdateCourier();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<typeof couriers extends (infer T)[] | undefined ? T : never>(null);

  const filteredCouriers = couriers?.filter(courier =>
    courier.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    courier.phone.includes(searchQuery) ||
    courier.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (courierId: string, isActive: boolean) => {
    try {
      await updateCourier.mutateAsync({ id: courierId, is_active: !isActive });
      toast.success(isActive ? 'Kurir dinonaktifkan' : 'Kurir diaktifkan');
    } catch (error) {
      toast.error('Gagal mengubah status kurir');
    }
  };

  const activeCouriers = couriers?.filter(c => c.is_active).length || 0;
  const totalDeliveries = couriers?.reduce((sum, c) => sum + c.total_deliveries, 0) || 0;

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kurir</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{couriers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kurir Aktif</CardTitle>
              <Truck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeCouriers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengiriman</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveries}</div>
            </CardContent>
          </Card>
        </div>

        {/* Couriers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kurir</CardTitle>
            <CardDescription>Kelola data kurir dan status keaktifan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, telepon, plat..."
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
                      <TableHead>Kurir</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Kendaraan</TableHead>
                      <TableHead className="text-center">Pengiriman</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCouriers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada kurir ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCouriers?.map((courier) => (
                        <TableRow key={courier.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{courier.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Bergabung {format(new Date(courier.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {courier.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            {courier.vehicle_type ? (
                              <div>
                                <p className="text-sm">{courier.vehicle_type}</p>
                                <p className="text-xs text-muted-foreground">{courier.vehicle_plate}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{courier.total_deliveries}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={courier.is_active}
                              onCheckedChange={() => handleToggleActive(courier.id, courier.is_active)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCourier(courier)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Detail Kurir</DialogTitle>
                                </DialogHeader>
                                {selectedCourier && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Truck className="h-8 w-8 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-lg">{selectedCourier.full_name}</h3>
                                        <p className="text-muted-foreground">{selectedCourier.phone}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Kendaraan</p>
                                        <p className="font-medium">{selectedCourier.vehicle_type || '-'}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Plat Nomor</p>
                                        <p className="font-medium">{selectedCourier.vehicle_plate || '-'}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Total Pengiriman</p>
                                        <p className="font-medium">{selectedCourier.total_deliveries}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <Badge variant={selectedCourier.is_active ? 'default' : 'secondary'}>
                                          {selectedCourier.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Bergabung: {format(new Date(selectedCourier.created_at), 'dd MMMM yyyy', { locale: idLocale })}
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

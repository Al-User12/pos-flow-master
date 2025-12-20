import { useState } from 'react';
import { useAdminCouriers, useUpdateCourier, useCreateCourier } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Truck, Phone, Package, Plus, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { exportToCSV, formatDate } from '@/lib/exportUtils';

interface CourierFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
}

const initialFormData: CourierFormData = {
  email: '',
  password: '',
  full_name: '',
  phone: '',
  vehicle_type: '',
  vehicle_plate: '',
};

export default function AdminCouriers() {
  const { data: couriers, isLoading } = useAdminCouriers();
  const updateCourier = useUpdateCourier();
  const createCourier = useCreateCourier();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCourier, setSelectedCourier] = useState<typeof couriers extends (infer T)[] | undefined ? T : never>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CourierFormData>(initialFormData);
  const [editFormData, setEditFormData] = useState<{
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    vehicle_plate: string;
  } | null>(null);

  const filteredCouriers = couriers?.filter(courier => {
    const matchesSearch = 
      courier.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone.includes(searchQuery) ||
      courier.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const courierDate = new Date(courier.created_at);
    const matchesDate = !dateRange?.from || (
      courierDate >= dateRange.from && 
      (!dateRange.to || courierDate <= dateRange.to)
    );
    
    return matchesSearch && matchesDate;
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredCouriers, itemsPerPage: 10 });

  const handleToggleActive = async (courierId: string, isActive: boolean) => {
    try {
      await updateCourier.mutateAsync({ id: courierId, is_active: !isActive });
      toast.success(isActive ? 'Kurir dinonaktifkan' : 'Kurir diaktifkan');
    } catch (error) {
      toast.error('Gagal mengubah status kurir');
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.full_name || !formData.phone) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }

    try {
      await createCourier.mutateAsync(formData);
      toast.success('Kurir berhasil ditambahkan');
      setDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan kurir');
    }
  };

  const handleEdit = async () => {
    if (!editFormData) return;

    try {
      await updateCourier.mutateAsync({
        id: editFormData.id,
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        vehicle_type: editFormData.vehicle_type || undefined,
        vehicle_plate: editFormData.vehicle_plate || undefined,
      });
      toast.success('Data kurir berhasil diperbarui');
      setEditDialogOpen(false);
      setEditFormData(null);
    } catch (error) {
      toast.error('Gagal memperbarui data kurir');
    }
  };

  const handleOpenEdit = (courier: NonNullable<typeof couriers>[0]) => {
    setEditFormData({
      id: courier.id,
      full_name: courier.full_name,
      phone: courier.phone,
      vehicle_type: courier.vehicle_type || '',
      vehicle_plate: courier.vehicle_plate || '',
    });
    setEditDialogOpen(true);
  };

  const handleExport = () => {
    if (!filteredCouriers) return;
    const data = filteredCouriers.map(c => ({
      Nama: c.full_name,
      Telepon: c.phone,
      'Tipe Kendaraan': c.vehicle_type || '-',
      'Plat Nomor': c.vehicle_plate || '-',
      'Total Pengiriman': c.total_deliveries,
      Status: c.is_active ? 'Aktif' : 'Nonaktif',
      'Tgl Bergabung': formatDate(new Date(c.created_at)),
    }));
    exportToCSV(data, `kurir-${formatDate(new Date())}`);
  };

  const activeCouriers = couriers?.filter(c => c.is_active).length || 0;
  const totalDeliveries = couriers?.reduce((sum, c) => sum + c.total_deliveries, 0) || 0;

  return (
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
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, telepon, plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filter tanggal"
              className="w-full md:w-auto"
            />
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleExport} disabled={!filteredCouriers?.length}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kurir
              </Button>
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
                  {paginatedData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada kurir ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData?.map((courier) => (
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
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(courier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Courier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kurir Baru</DialogTitle>
            <DialogDescription>
              Buat akun kurir baru dengan mengisi data berikut
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kurir@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nama lengkap kurir"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipe Kendaraan</Label>
                <Input
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="Motor/Mobil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Plat Nomor</Label>
                <Input
                  id="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  placeholder="B 1234 ABC"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={createCourier.isPending}>
              {createCourier.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Courier Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Kurir</DialogTitle>
            <DialogDescription>
              Perbarui informasi kurir
            </DialogDescription>
          </DialogHeader>

          {editFormData && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nama Lengkap</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Nomor Telepon</Label>
                <Input
                  id="edit_phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_vehicle_type">Tipe Kendaraan</Label>
                  <Input
                    id="edit_vehicle_type"
                    value={editFormData.vehicle_type}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicle_type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_vehicle_plate">Plat Nomor</Label>
                  <Input
                    id="edit_vehicle_plate"
                    value={editFormData.vehicle_plate}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicle_plate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={updateCourier.isPending}>
              {updateCourier.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

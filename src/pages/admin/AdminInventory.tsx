import { useState } from 'react';
import { Search, Box, Plus, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Download } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { exportToCSV, formatDate } from '@/lib/exportUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminInventory, useInventoryMovements, useAddInventoryMovement, useAdminProducts } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AdminInventory() {
  const { toast } = useToast();
  const { data: inventory, isLoading: inventoryLoading } = useAdminInventory();
  const { data: movements, isLoading: movementsLoading } = useInventoryMovements();
  const { data: products } = useAdminProducts();
  const addMovement = useAddInventoryMovement();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementData, setMovementData] = useState({
    product_id: '',
    movement_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: '',
    unit_cost: 0,
  });

  const filteredInventory = inventory?.filter(inv =>
    inv.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.product?.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = filteredInventory?.filter(inv => inv.quantity <= inv.min_stock);

  const {
    paginatedData: paginatedInventory,
    currentPage: invPage,
    totalPages: invTotalPages,
    goToPage: goToInvPage,
    startIndex: invStartIndex,
    endIndex: invEndIndex,
    totalItems: invTotalItems,
  } = usePagination({ data: filteredInventory, itemsPerPage: 10 });

  const {
    paginatedData: paginatedMovements,
    currentPage: movPage,
    totalPages: movTotalPages,
    goToPage: goToMovPage,
    startIndex: movStartIndex,
    endIndex: movEndIndex,
    totalItems: movTotalItems,
  } = usePagination({ data: movements, itemsPerPage: 10 });

  const handleExportInventory = () => {
    if (!filteredInventory) return;
    const data = filteredInventory.map(inv => ({
      SKU: inv.product?.sku || '-',
      Produk: inv.product?.name || '-',
      Stok: inv.quantity,
      'Min Stok': inv.min_stock,
      Reserved: inv.reserved_quantity,
      Available: inv.quantity - inv.reserved_quantity,
    }));
    exportToCSV(data, `inventori-${formatDate(new Date())}`);
  };

  const handleExportMovements = () => {
    if (!movements) return;
    const data = movements.map(mov => ({
      Tanggal: formatDate(new Date(mov.created_at)),
      SKU: mov.product?.sku || '-',
      Produk: mov.product?.name || '-',
      Tipe: mov.movement_type === 'in' ? 'Masuk' : mov.movement_type === 'out' ? 'Keluar' : 'Adjustment',
      Qty: mov.quantity,
      Sebelum: mov.quantity_before,
      Sesudah: mov.quantity_after,
      Alasan: mov.reason,
      'Unit Cost': mov.unit_cost || 0,
    }));
    exportToCSV(data, `mutasi-stok-${formatDate(new Date())}`);
  };

  const handleOpenMovement = (productId?: string) => {
    setMovementData({
      product_id: productId || '',
      movement_type: 'in',
      quantity: 0,
      reason: '',
      unit_cost: 0,
    });
    setDialogOpen(true);
  };

  const handleSubmitMovement = async () => {
    if (!movementData.product_id || !movementData.quantity || !movementData.reason) {
      toast({ title: 'Lengkapi semua field yang wajib', variant: 'destructive' });
      return;
    }

    try {
      await addMovement.mutateAsync(movementData);
      toast({ title: 'Mutasi stok berhasil dicatat' });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Gagal mencatat mutasi',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <RotateCcw className="h-4 w-4 text-info" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Masuk';
      case 'out':
        return 'Keluar';
      default:
        return 'Adjustment';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportInventory} disabled={!filteredInventory?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export Stok
          </Button>
          <Button onClick={() => handleOpenMovement()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mutasi
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((inv) => (
                <Badge key={inv.id} variant="outline" className="border-warning text-warning">
                  {inv.product?.name}: {inv.quantity} unit
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stok Produk</TabsTrigger>
          <TabsTrigger value="movements">Riwayat Mutasi</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Stok Inventori
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead className="text-center">Min. Stok</TableHead>
                        <TableHead className="text-center">Reserved</TableHead>
                        <TableHead className="text-center">Available</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInventory?.map((inv) => {
                        const isLowStock = inv.quantity <= inv.min_stock;
                        const available = inv.quantity - inv.reserved_quantity;

                        return (
                          <TableRow key={inv.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {inv.product?.image_url ? (
                                  <img
                                    src={inv.product.image_url}
                                    alt={inv.product?.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Box className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium">{inv.product?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{inv.product?.sku}</TableCell>
                            <TableCell className="text-center">
                              <span className={isLowStock ? 'text-destructive font-bold' : ''}>
                                {inv.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {inv.min_stock}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {inv.reserved_quantity}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {available}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenMovement(inv.product_id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Mutasi
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {invTotalPages > 1 && (
                <DataPagination
                  currentPage={invPage}
                  totalPages={invTotalPages}
                  onPageChange={goToInvPage}
                  startIndex={invStartIndex}
                  endIndex={invEndIndex}
                  totalItems={invTotalItems}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Riwayat Mutasi
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportMovements} disabled={!movements?.length}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Tipe</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-center">Sebelum</TableHead>
                        <TableHead className="text-center">Sesudah</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMovements?.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            {format(new Date(mov.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{mov.product?.name}</p>
                              <p className="text-xs text-muted-foreground">{mov.product?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getMovementIcon(mov.movement_type)}
                              <span className="text-sm">{getMovementLabel(mov.movement_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {mov.movement_type === 'in' ? '+' : mov.movement_type === 'out' ? '-' : ''}
                            {mov.quantity}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {mov.quantity_before}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {mov.quantity_after}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {mov.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            {mov.unit_cost ? formatCurrency(Number(mov.unit_cost)) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {movTotalPages > 1 && (
                <DataPagination
                  currentPage={movPage}
                  totalPages={movTotalPages}
                  onPageChange={goToMovPage}
                  startIndex={movStartIndex}
                  endIndex={movEndIndex}
                  totalItems={movTotalItems}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Mutasi Stok</DialogTitle>
            <DialogDescription>
              Catat perubahan stok produk
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produk *</Label>
              <Select
                value={movementData.product_id}
                onValueChange={(v) => setMovementData({ ...movementData, product_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products?.filter(p => p.is_active).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipe Mutasi *</Label>
              <Select
                value={movementData.movement_type}
                onValueChange={(v) => setMovementData({ ...movementData, movement_type: v as 'in' | 'out' | 'adjustment' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Stok Masuk
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Stok Keluar
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-info" />
                      Penyesuaian
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input
                  type="number"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  value={movementData.unit_cost}
                  onChange={(e) => setMovementData({ ...movementData, unit_cost: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alasan *</Label>
              <Textarea
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                placeholder="Contoh: Restok dari supplier, Barang rusak, dll"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitMovement} disabled={addMovement.isPending}>
              {addMovement.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

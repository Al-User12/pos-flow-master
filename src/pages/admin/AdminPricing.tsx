import { useState } from 'react';
import { useAdminProducts, useUpdateProductPrice, useProductPriceHistory } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Edit, History, DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AdminPricing() {
  const { data: products, isLoading } = useAdminProducts();
  const updatePrice = useUpdateProductPrice();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({
    selling_price: '',
    hpp_average: '',
    het: '',
  });

  const { data: priceHistory } = useProductPriceHistory(selectedProduct || '');

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentPrice = (product: typeof products extends (infer T)[] | undefined ? T : never) => {
    if (!product?.prices || product.prices.length === 0) return null;
    return product.prices.sort((a, b) => 
      new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
    )[0];
  };

  const getMargin = (sellingPrice: number, hpp: number) => {
    if (hpp === 0) return 0;
    return ((sellingPrice - hpp) / sellingPrice) * 100;
  };

  const handleEditPrice = (product: typeof products extends (infer T)[] | undefined ? T : never) => {
    if (!product) return;
    const currentPrice = getCurrentPrice(product);
    setSelectedProduct(product.id);
    setPriceForm({
      selling_price: currentPrice?.selling_price?.toString() || '',
      hpp_average: currentPrice?.hpp_average?.toString() || '',
      het: currentPrice?.het?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProduct(productId);
    setHistoryDialogOpen(true);
  };

  const handleSavePrice = async () => {
    if (!selectedProduct) return;
    
    try {
      await updatePrice.mutateAsync({
        product_id: selectedProduct,
        selling_price: parseFloat(priceForm.selling_price),
        hpp_average: parseFloat(priceForm.hpp_average),
        het: priceForm.het ? parseFloat(priceForm.het) : undefined,
      });
      toast.success('Harga berhasil diperbarui');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Gagal memperbarui harga');
    }
  };

  // Stats
  const totalProducts = products?.length || 0;
  const productsWithPrice = products?.filter(p => p.prices && p.prices.length > 0).length || 0;
  const lowMarginProducts = products?.filter(p => {
    const price = getCurrentPrice(p);
    if (!price) return false;
    const margin = getMargin(Number(price.selling_price), Number(price.hpp_average));
    return margin < 10;
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Ada Harga</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{productsWithPrice}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowMarginProducts}</div>
            <p className="text-xs text-muted-foreground">Margin &lt; 10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga Produk</CardTitle>
          <CardDescription>Kelola harga jual, HPP, dan HET produk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau SKU produk..."
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
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="text-right">HET</TableHead>
                    <TableHead className="text-center">Margin</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada produk ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts?.map((product) => {
                      const currentPrice = getCurrentPrice(product);
                      const margin = currentPrice 
                        ? getMargin(Number(currentPrice.selling_price), Number(currentPrice.hpp_average))
                        : 0;

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {currentPrice ? (
                              <span className="font-mono">
                                {formatCurrency(Number(currentPrice.hpp_average))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {currentPrice ? (
                              <span className="font-mono font-medium">
                                {formatCurrency(Number(currentPrice.selling_price))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {currentPrice?.het ? (
                              <span className="font-mono text-sm">
                                {formatCurrency(Number(currentPrice.het))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {currentPrice ? (
                              <Badge 
                                variant={margin >= 20 ? 'default' : margin >= 10 ? 'secondary' : 'destructive'}
                              >
                                {margin.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPrice(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(product.id)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Price Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Harga Produk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>HPP (Harga Pokok Penjualan)</Label>
              <Input
                type="number"
                placeholder="Masukkan HPP"
                value={priceForm.hpp_average}
                onChange={(e) => setPriceForm(prev => ({ ...prev, hpp_average: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Harga Jual</Label>
              <Input
                type="number"
                placeholder="Masukkan harga jual"
                value={priceForm.selling_price}
                onChange={(e) => setPriceForm(prev => ({ ...prev, selling_price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>HET (Harga Eceran Tertinggi) - Opsional</Label>
              <Input
                type="number"
                placeholder="Masukkan HET"
                value={priceForm.het}
                onChange={(e) => setPriceForm(prev => ({ ...prev, het: e.target.value }))}
              />
            </div>
            {priceForm.selling_price && priceForm.hpp_average && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Margin Preview</p>
                <p className="text-lg font-semibold">
                  {getMargin(
                    parseFloat(priceForm.selling_price) || 0,
                    parseFloat(priceForm.hpp_average) || 0
                  ).toFixed(2)}%
                </p>
                <p className="text-sm">
                  Profit: {formatCurrency(
                    (parseFloat(priceForm.selling_price) || 0) - (parseFloat(priceForm.hpp_average) || 0)
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSavePrice}
              disabled={!priceForm.selling_price || !priceForm.hpp_average || updatePrice.isPending}
            >
              {updatePrice.isPending ? 'Menyimpan...' : 'Simpan Harga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Harga
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {priceHistory && priceHistory.length > 0 ? (
              priceHistory.map((price, index) => (
                <div 
                  key={price.id} 
                  className={`p-3 rounded-lg border ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index === 0 ? 'Harga Aktif' : 'Riwayat'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(price.effective_date), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">HPP</p>
                      <p className="font-medium">{formatCurrency(Number(price.hpp_average))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Harga Jual</p>
                      <p className="font-medium">{formatCurrency(Number(price.selling_price))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">HET</p>
                      <p className="font-medium">{price.het ? formatCurrency(Number(price.het)) : '-'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada riwayat harga
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

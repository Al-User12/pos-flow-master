import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  FileText, 
  Eye,
  User,
  Package,
  ShoppingCart,
  Settings,
  Truck,
  Wallet,
  Clock,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { exportToCSV, formatDate } from '@/lib/exportUtils';

const entityTypeLabels: Record<string, string> = {
  orders: 'Pesanan',
  products: 'Produk',
  inventory: 'Inventori',
  buyer_profiles: 'Pelanggan',
  courier_profiles: 'Kurir',
  payout_requests: 'Payout',
  system_settings: 'Pengaturan',
};

const entityTypeIcons: Record<string, React.ReactNode> = {
  orders: <ShoppingCart className="h-4 w-4" />,
  products: <Package className="h-4 w-4" />,
  inventory: <Package className="h-4 w-4" />,
  buyer_profiles: <User className="h-4 w-4" />,
  courier_profiles: <Truck className="h-4 w-4" />,
  payout_requests: <Wallet className="h-4 w-4" />,
  system_settings: <Settings className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-success text-success-foreground',
  update: 'bg-info text-info-foreground',
  delete: 'bg-destructive text-destructive-foreground',
  insert: 'bg-success text-success-foreground',
};

export default function AdminAuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { data: logs, isLoading } = useAdminAuditLogs();
  const [selectedLog, setSelectedLog] = useState<typeof logs extends (infer T)[] | undefined ? T : never>(null);

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.includes(searchQuery);
    
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesEntity && matchesAction;
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredLogs, itemsPerPage: 20 });

  const handleExport = () => {
    if (!filteredLogs) return;
    const data = filteredLogs.map(l => ({
      Waktu: formatDate(new Date(l.created_at)),
      Entitas: entityTypeLabels[l.entity_type] || l.entity_type,
      Aksi: l.action.toUpperCase(),
      'Entity ID': l.entity_id,
      'IP Address': l.ip_address || '-',
    }));
    exportToCSV(data, `audit-log-${formatDate(new Date())}`);
  };

  const formatJsonValue = (value: any) => {
    if (!value) return '-';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Log</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs?.filter(l => 
                format(new Date(l.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipe Entitas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs?.map(l => l.entity_type)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Riwayat semua aktivitas sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari entity ID atau tipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Entitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Entitas</SelectItem>
                <SelectItem value="orders">Pesanan</SelectItem>
                <SelectItem value="products">Produk</SelectItem>
                <SelectItem value="inventory">Inventori</SelectItem>
                <SelectItem value="buyer_profiles">Pelanggan</SelectItem>
                <SelectItem value="courier_profiles">Kurir</SelectItem>
                <SelectItem value="payout_requests">Payout</SelectItem>
                <SelectItem value="system_settings">Pengaturan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="insert">Insert</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={!filteredLogs?.length}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Entitas</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-center">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada log ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(log.created_at), 'dd MMM yyyy', { locale: idLocale })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entityTypeIcons[log.entity_type] || <FileText className="h-4 w-4" />}
                            <span>{entityTypeLabels[log.entity_type] || log.entity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || 'bg-secondary'}>
                            {log.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{log.entity_id.slice(0, 8)}...</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {log.ip_address || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Detail Audit Log</DialogTitle>
                              </DialogHeader>
                              {selectedLog && (
                                <ScrollArea className="max-h-[60vh]">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Waktu</p>
                                        <p className="font-medium">
                                          {format(new Date(selectedLog.created_at), 'dd MMMM yyyy HH:mm:ss', { locale: idLocale })}
                                        </p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Aksi</p>
                                        <Badge className={actionColors[selectedLog.action] || 'bg-secondary'}>
                                          {selectedLog.action.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Entitas</p>
                                        <p className="font-medium">{entityTypeLabels[selectedLog.entity_type] || selectedLog.entity_type}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">Entity ID</p>
                                        <p className="font-mono text-sm break-all">{selectedLog.entity_id}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">IP Address</p>
                                        <p className="font-medium">{selectedLog.ip_address || '-'}</p>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground">User Agent</p>
                                        <p className="text-xs truncate">{selectedLog.user_agent || '-'}</p>
                                      </div>
                                    </div>

                                    {selectedLog.old_value && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-2">Nilai Lama</p>
                                        <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                                          {formatJsonValue(selectedLog.old_value)}
                                        </pre>
                                      </div>
                                    )}

                                    {selectedLog.new_value && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-2">Nilai Baru</p>
                                        <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                                          {formatJsonValue(selectedLog.new_value)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
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
    </div>
  );
}

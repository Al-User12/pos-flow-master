import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Camera, Search, Eye, Package, User, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDeliveryProofs() {
  const [search, setSearch] = useState("");
  const [selectedProof, setSelectedProof] = useState<any>(null);

  const { data: proofs, isLoading } = useQuery({
    queryKey: ["admin-delivery-proofs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_proofs")
        .select(`
          *,
          orders (
            id,
            order_number,
            total,
            status,
            delivered_at,
            buyer_id,
            courier_id,
            order_addresses (
              recipient_name,
              address,
              phone
            ),
            buyer_profiles:buyer_id (
              full_name,
              phone
            ),
            courier_profiles:courier_id (
              full_name,
              phone
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProofs = proofs?.filter((proof) => {
    const searchLower = search.toLowerCase();
    const order = proof.orders;
    return (
      order?.order_number?.toLowerCase().includes(searchLower) ||
      (order?.courier_profiles as any)?.full_name?.toLowerCase().includes(searchLower) ||
      (order?.buyer_profiles as any)?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold text-foreground">Bukti Pengiriman</h1>
          <p className="text-muted-foreground">
            Lihat semua foto bukti pengiriman dari kurir
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor order, kurir, atau pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Proofs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : filteredProofs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Belum Ada Bukti Pengiriman
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              Bukti pengiriman akan muncul di sini setelah kurir menyelesaikan pengiriman
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProofs?.map((proof) => {
              const order = proof.orders;
              const courier = order?.courier_profiles as any;
              const address = Array.isArray(order?.order_addresses)
                ? order.order_addresses[0]
                : order?.order_addresses;

              return (
                <Card
                  key={proof.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedProof(proof)}
                >
                  <div className="aspect-video relative">
                    <img
                      src={proof.photo_url}
                      alt="Bukti pengiriman"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <Badge className="absolute top-2 right-2 bg-green-600">
                      Terkirim
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">
                        {order?.order_number}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(order?.total || 0)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>Kurir: {courier?.full_name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="w-3.5 h-3.5" />
                        <span>Penerima: {address?.recipient_name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(proof.created_at), "dd MMM yyyy, HH:mm", {
                            locale: id,
                          })}
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Lihat Detail
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Bukti Pengiriman - {selectedProof?.orders?.order_number}
              </DialogTitle>
            </DialogHeader>

            {selectedProof && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedProof.photo_url}
                    alt="Bukti pengiriman"
                    className="w-full max-h-96 object-contain bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Informasi Order
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">No. Order:</span>{" "}
                        {selectedProof.orders?.order_number}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Total:</span>{" "}
                        {formatPrice(selectedProof.orders?.total || 0)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Dikirim:</span>{" "}
                        {selectedProof.orders?.delivered_at
                          ? format(
                              new Date(selectedProof.orders.delivered_at),
                              "dd MMM yyyy, HH:mm",
                              { locale: id }
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Informasi Kurir
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Nama:</span>{" "}
                        {(selectedProof.orders?.courier_profiles as any)?.full_name || "-"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Telepon:</span>{" "}
                        {(selectedProof.orders?.courier_profiles as any)?.phone || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Alamat Pengiriman
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    {(() => {
                      const addr = Array.isArray(selectedProof.orders?.order_addresses)
                        ? selectedProof.orders.order_addresses[0]
                        : selectedProof.orders?.order_addresses;
                      return (
                        <>
                          <p>
                            <span className="text-muted-foreground">Penerima:</span>{" "}
                            {addr?.recipient_name || "-"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Alamat:</span>{" "}
                            {addr?.address || "-"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Telepon:</span>{" "}
                            {addr?.phone || "-"}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {selectedProof.notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Catatan Kurir
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      {selectedProof.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ShoppingCart, CreditCard, Truck, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SeedResult {
  type: string;
  count: number;
  status: "success" | "error";
  message?: string;
}

const AdminSeeder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [selectedSeeds, setSelectedSeeds] = useState({
    users: true,
    orders: true,
    payments: true,
    deliveryProofs: true,
  });

  const seedDemoUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-users");
      
      if (error) throw error;
      
      const createdCount = data.results?.filter((r: any) => r.status === "created").length || 0;
      const existsCount = data.results?.filter((r: any) => r.status === "exists").length || 0;
      
      return { 
        success: true, 
        count: createdCount,
        message: `${createdCount} user baru, ${existsCount} sudah ada` 
      };
    } catch (error) {
      console.error("Error seeding users:", error);
      return { success: false, count: 0, message: String(error) };
    }
  };

  const seedDemoOrders = async () => {
    try {
      // Get buyer profiles
      const { data: buyers } = await supabase.from("buyer_profiles").select("id").limit(3);
      if (!buyers?.length) throw new Error("No buyer profiles found. Seed users first.");

      // Get courier profiles  
      const { data: couriers } = await supabase.from("courier_profiles").select("id").limit(2);
      
      // Get products with prices
      const { data: products } = await supabase
        .from("products")
        .select(`
          id, name, sku,
          product_prices!inner(selling_price, hpp_average)
        `)
        .eq("is_active", true)
        .limit(10);
      
      if (!products?.length) throw new Error("No products found.");

      // Get domicile
      const { data: domiciles } = await supabase.from("domiciles").select("id").limit(1);

      const orderStatuses: Array<{
        status: "new" | "waiting_payment" | "paid" | "assigned" | "picked_up" | "on_delivery" | "delivered" | "cancelled";
        count: number;
        needsCourier: boolean;
      }> = [
        { status: "new", count: 3, needsCourier: false },
        { status: "waiting_payment", count: 3, needsCourier: false },
        { status: "paid", count: 3, needsCourier: false },
        { status: "assigned", count: 3, needsCourier: true },
        { status: "picked_up", count: 2, needsCourier: true },
        { status: "on_delivery", count: 2, needsCourier: true },
        { status: "delivered", count: 5, needsCourier: true },
        { status: "cancelled", count: 2, needsCourier: false },
      ];

      let totalOrders = 0;

      for (const orderConfig of orderStatuses) {
        for (let i = 0; i < orderConfig.count; i++) {
          const buyer = buyers[Math.floor(Math.random() * buyers.length)];
          const courier = orderConfig.needsCourier && couriers?.length 
            ? couriers[Math.floor(Math.random() * couriers.length)] 
            : null;

          // Random products for this order (1-3 items)
          const itemCount = Math.floor(Math.random() * 3) + 1;
          const orderProducts = [];
          let subtotal = 0;
          let totalHpp = 0;

          for (let j = 0; j < itemCount; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const price = product.product_prices?.[0]?.selling_price || 10000;
            const hpp = product.product_prices?.[0]?.hpp_average || 5000;
            const qty = Math.floor(Math.random() * 3) + 1;
            
            orderProducts.push({
              product_id: product.id,
              product_name: product.name,
              quantity: qty,
              price_at_order: price,
              hpp_at_order: hpp,
              subtotal: price * qty,
            });
            
            subtotal += price * qty;
            totalHpp += hpp * qty;
          }

          const shippingCost = 15000;
          const adminFee = 2500;
          const total = subtotal + shippingCost + adminFee;

          // Generate order number
          const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Create order
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([{
              buyer_id: buyer.id,
              courier_id: courier?.id || null,
              status: orderConfig.status,
              subtotal,
              shipping_cost: shippingCost,
              admin_fee: adminFee,
              total,
              total_hpp: totalHpp,
              order_number: orderNumber,
              notes: `Demo order - ${orderConfig.status}`,
              assigned_at: courier ? new Date().toISOString() : null,
              picked_up_at: ["picked_up", "on_delivery", "delivered"].includes(orderConfig.status) 
                ? new Date().toISOString() : null,
              delivered_at: orderConfig.status === "delivered" ? new Date().toISOString() : null,
              cancelled_at: orderConfig.status === "cancelled" ? new Date().toISOString() : null,
            }])
            .select()
            .single();

          if (orderError) {
            console.error("Error creating order:", orderError);
            continue;
          }

          // Create order items
          const orderItems = orderProducts.map((p) => ({
            order_id: order.id,
            ...p,
          }));
          await supabase.from("order_items").insert(orderItems);

          // Create order address
          await supabase.from("order_addresses").insert({
            order_id: order.id,
            recipient_name: `Penerima ${i + 1}`,
            phone: `08123456789${i}`,
            address: `Jl. Demo No. ${Math.floor(Math.random() * 100) + 1}, RT 01/RW 02`,
            domicile_id: domiciles?.[0]?.id || null,
            landmark: "Dekat warung",
            notes: "Rumah warna putih",
          });

          totalOrders++;
        }
      }

      return { success: true, count: totalOrders, message: `${totalOrders} orders created` };
    } catch (error) {
      console.error("Error seeding orders:", error);
      return { success: false, count: 0, message: String(error) };
    }
  };

  const seedPaymentConfirmations = async () => {
    try {
      // Get orders that need payment confirmation (paid and above)
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total")
        .in("status", ["paid", "assigned", "picked_up", "on_delivery", "delivered"])
        .ilike("notes", "%Demo order%");

      if (!orders?.length) {
        return { success: true, count: 0, message: "No orders need payment confirmation" };
      }

      // Check existing payment confirmations
      const { data: existingPayments } = await supabase
        .from("payment_confirmations")
        .select("order_id");
      
      const existingOrderIds = new Set(existingPayments?.map((p) => p.order_id) || []);
      const ordersNeedingPayment = orders.filter((o) => !existingOrderIds.has(o.id));

      let count = 0;
      for (const order of ordersNeedingPayment) {
        const { error } = await supabase.from("payment_confirmations").insert({
          order_id: order.id,
          amount: order.total,
          bank_name: ["BCA", "Mandiri", "BNI", "BRI"][Math.floor(Math.random() * 4)],
          account_number: `123456789${count}`,
          proof_image_url: "https://placehold.co/400x600/png?text=Bukti+Transfer",
          transfer_date: new Date().toISOString(),
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        });

        if (!error) count++;
      }

      return { success: true, count, message: `${count} payment confirmations created` };
    } catch (error) {
      console.error("Error seeding payments:", error);
      return { success: false, count: 0, message: String(error) };
    }
  };

  const seedDeliveryProofs = async () => {
    try {
      // Get delivered orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, courier_id")
        .eq("status", "delivered")
        .not("courier_id", "is", null);

      if (!orders?.length) {
        return { success: true, count: 0, message: "No delivered orders found" };
      }

      // Check existing delivery proofs
      const { data: existingProofs } = await supabase
        .from("delivery_proofs")
        .select("order_id");
      
      const existingOrderIds = new Set(existingProofs?.map((p) => p.order_id) || []);
      const ordersNeedingProof = orders.filter((o) => !existingOrderIds.has(o.id));

      let count = 0;
      for (const order of ordersNeedingProof) {
        // Get courier user_id
        const { data: courier } = await supabase
          .from("courier_profiles")
          .select("user_id")
          .eq("id", order.courier_id)
          .single();

        const { error } = await supabase.from("delivery_proofs").insert({
          order_id: order.id,
          photo_url: "https://placehold.co/400x600/png?text=Bukti+Pengiriman",
          notes: "Paket diterima dengan baik",
          created_by: courier?.user_id || null,
        });

        if (!error) count++;
      }

      return { success: true, count, message: `${count} delivery proofs created` };
    } catch (error) {
      console.error("Error seeding delivery proofs:", error);
      return { success: false, count: 0, message: String(error) };
    }
  };

  const handleSeedAll = async () => {
    setIsLoading(true);
    setResults([]);
    const newResults: SeedResult[] = [];

    try {
      if (selectedSeeds.users) {
        const userResult = await seedDemoUsers();
        newResults.push({
          type: "Demo Users",
          count: userResult.count,
          status: userResult.success ? "success" : "error",
          message: userResult.message,
        });
      }

      if (selectedSeeds.orders) {
        const orderResult = await seedDemoOrders();
        newResults.push({
          type: "Demo Orders",
          count: orderResult.count,
          status: orderResult.success ? "success" : "error",
          message: orderResult.message,
        });
      }

      if (selectedSeeds.payments) {
        const paymentResult = await seedPaymentConfirmations();
        newResults.push({
          type: "Payment Confirmations",
          count: paymentResult.count,
          status: paymentResult.success ? "success" : "error",
          message: paymentResult.message,
        });
      }

      if (selectedSeeds.deliveryProofs) {
        const proofResult = await seedDeliveryProofs();
        newResults.push({
          type: "Delivery Proofs",
          count: proofResult.count,
          status: proofResult.success ? "success" : "error",
          message: proofResult.message,
        });
      }

      setResults(newResults);
      
      const hasError = newResults.some((r) => r.status === "error");
      if (hasError) {
        toast.error("Beberapa seed data gagal");
      } else {
        toast.success("Seed data berhasil!");
      }
    } catch (error) {
      console.error("Seed error:", error);
      toast.error("Terjadi kesalahan saat seed data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!confirm("Yakin ingin menghapus semua data demo? Ini akan menghapus orders dengan notes 'Demo order'")) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete demo orders (cascade will delete items, addresses, etc.)
      const { error } = await supabase
        .from("orders")
        .delete()
        .ilike("notes", "%Demo order%");

      if (error) throw error;

      toast.success("Data demo berhasil dihapus");
      setResults([]);
    } catch (error) {
      console.error("Error clearing demo data:", error);
      toast.error("Gagal menghapus data demo");
    } finally {
      setIsLoading(false);
    }
  };

  const seedOptions = [
    { key: "users", label: "Demo Users", icon: Users, description: "1 Admin, 2 Kurir, 3 Buyer" },
    { key: "orders", label: "Demo Orders", icon: ShoppingCart, description: "~23 orders berbagai status" },
    { key: "payments", label: "Payment Confirmations", icon: CreditCard, description: "Bukti bayar untuk orders" },
    { key: "deliveryProofs", label: "Delivery Proofs", icon: Truck, description: "Bukti kirim untuk delivered" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seed Data Demo</h1>
        <p className="text-muted-foreground">Generate data demo untuk testing aplikasi</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Seed Options */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Data yang Ingin Di-Generate</CardTitle>
            <CardDescription>Centang data yang ingin dibuat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {seedOptions.map((option) => (
              <div key={option.key} className="flex items-start space-x-3">
                <Checkbox
                  id={option.key}
                  checked={selectedSeeds[option.key as keyof typeof selectedSeeds]}
                  onCheckedChange={(checked) =>
                    setSelectedSeeds((prev) => ({ ...prev, [option.key]: !!checked }))
                  }
                />
                <div className="flex-1">
                  <label htmlFor={option.key} className="flex items-center gap-2 font-medium cursor-pointer">
                    <option.icon className="h-4 w-4 text-muted-foreground" />
                    {option.label}
                  </label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}

            <div className="pt-4 flex gap-2">
              <Button onClick={handleSeedAll} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Generate Seed Data"
                )}
              </Button>
              <Button variant="destructive" onClick={handleClearDemoData} disabled={isLoading}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts Info */}
        <Card>
          <CardHeader>
            <CardTitle>Akun Demo</CardTitle>
            <CardDescription>Akun yang akan dibuat untuk testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">admin@demo.com</p>
                  <p className="text-sm text-muted-foreground">Password: demo123456</p>
                </div>
                <Badge>Super Admin</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">kurir1@demo.com</p>
                  <p className="text-sm text-muted-foreground">Password: demo123456</p>
                </div>
                <Badge variant="secondary">Kurir</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">buyer1@demo.com</p>
                  <p className="text-sm text-muted-foreground">Password: demo123456</p>
                </div>
                <Badge variant="outline">Buyer</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Juga dibuat: kurir2@demo.com, buyer2@demo.com, buyer3@demo.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Seed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.status === "success" ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.type}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant={result.status === "success" ? "default" : "destructive"}>
                      {result.count} items
                    </Badge>
                    {result.message && (
                      <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSeeder;

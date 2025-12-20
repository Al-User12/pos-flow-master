import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

// Orders
export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_profiles!orders_buyer_id_fkey(id, full_name, phone),
          courier:courier_profiles!orders_courier_id_fkey(id, full_name, phone),
          order_items(*, product:products(name, image_url)),
          order_address:order_addresses(*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, courierId }: { orderId: string; status: OrderStatus; courierId?: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (courierId) {
        updateData.courier_id = courierId;
        updateData.assigned_at = new Date().toISOString();
      }
      
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      } else if (status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

// Products
export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          brand:brands(id, name),
          inventory(*),
          prices:product_prices(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      sku: string;
      description?: string;
      category_id?: string;
      brand_id?: string;
      image_url?: string;
      selling_price: number;
      hpp: number;
      initial_stock: number;
      min_stock: number;
    }) => {
      // Create product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          sku: product.sku,
          description: product.description,
          category_id: product.category_id,
          brand_id: product.brand_id,
          image_url: product.image_url,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          product_id: productData.id,
          quantity: product.initial_stock,
          min_stock: product.min_stock,
        });

      if (inventoryError) throw inventoryError;

      // Create price
      const { error: priceError } = await supabase
        .from('product_prices')
        .insert({
          product_id: productData.id,
          selling_price: product.selling_price,
          hpp_average: product.hpp,
        });

      if (priceError) throw priceError;

      return productData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: {
      id: string;
      name?: string;
      sku?: string;
      description?: string;
      category_id?: string;
      brand_id?: string;
      image_url?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

// Inventory
export function useAdminInventory() {
  return useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(id, name, sku, image_url, is_active)
        `)
        .order('quantity', { ascending: true });

      if (error) throw error;
      return data?.filter(inv => inv.product?.is_active);
    },
  });
}

export function useInventoryMovements(productId?: string) {
  return useQuery({
    queryKey: ['inventory-movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      movement_type: 'in' | 'out' | 'adjustment';
      quantity: number;
      reason: string;
      unit_cost?: number;
    }) => {
      // Get current inventory
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', movement.product_id)
        .single();

      if (invError) throw invError;

      const quantityBefore = inventory.quantity;
      let quantityAfter = quantityBefore;

      if (movement.movement_type === 'in') {
        quantityAfter = quantityBefore + movement.quantity;
      } else if (movement.movement_type === 'out') {
        quantityAfter = quantityBefore - movement.quantity;
      } else {
        quantityAfter = movement.quantity;
      }

      // Create movement record
      const { error: moveError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: movement.product_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: movement.reason,
          unit_cost: movement.unit_cost,
        });

      if (moveError) throw moveError;

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: quantityAfter })
        .eq('product_id', movement.product_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
  });
}

// Couriers
export function useAdminCouriers() {
  return useQuery({
    queryKey: ['admin-couriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

// Categories
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Brands  
export function useAdminBrands() {
  return useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Dashboard Stats
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString());

      if (ordersError) throw ordersError;

      // Get new orders count
      const { count: newOrdersCount, error: newOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      if (newOrdersError) throw newOrdersError;

      // Get active products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Get low stock items
      const { data: lowStock, error: lowStockError } = await supabase
        .from('inventory')
        .select('*, product:products(is_active)')
        .lt('quantity', 10);

      if (lowStockError) throw lowStockError;

      const lowStockCount = lowStock?.filter(inv => inv.product?.is_active).length || 0;

      const totalSales = todayOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      return {
        totalSalesToday: totalSales,
        newOrdersCount: newOrdersCount || 0,
        activeProductsCount: productsCount || 0,
        lowStockCount,
      };
    },
  });
}

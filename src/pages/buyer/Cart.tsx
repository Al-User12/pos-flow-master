import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Keranjang Kosong</h2>
          <p className="text-muted-foreground text-center mb-6">
            Belum ada produk di keranjang Anda
          </p>
          <Link to="/buyer/catalog">
            <Button className="gap-2">
              Mulai Belanja
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Keranjang</h1>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Kosongkan
        </Button>
      </div>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2">{item.name}</h3>
                  <p className="text-primary font-bold mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="sticky bottom-20 md:bottom-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Subtotal ({items.length} item)</span>
            <span className="font-bold text-lg text-foreground">{formatPrice(subtotal)}</span>
          </div>
          <Link to="/buyer/checkout">
            <Button className="w-full gap-2" size="lg">
              Checkout
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </BuyerLayout>
  );
}

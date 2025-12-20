import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useCart } from '@/contexts/CartContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, clearCart, totalItems } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRemove = (productId: string) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeItem(productId);
      setRemovingId(null);
    }, 200);
  };

  if (items.length === 0) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Keranjang Kosong</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-xs">
            Belum ada produk di keranjang Anda. Yuk mulai belanja!
          </p>
          <Link to="/buyer/catalog">
            <Button size="lg" className="gap-2 shadow-md">
              <ShoppingBag className="w-4 h-4" />
              Mulai Belanja
            </Button>
          </Link>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Keranjang</h1>
          <p className="text-sm text-muted-foreground">{totalItems} item</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Kosongkan
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kosongkan Keranjang?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua produk akan dihapus dari keranjang Anda. Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={clearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Ya, Kosongkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 mb-32">
        {items.map((item, index) => (
          <Card 
            key={item.productId}
            className={cn(
              "transition-all duration-200 animate-fade-in",
              removingId === item.productId && "opacity-0 scale-95"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Package className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-primary font-bold mt-1">{formatPrice(item.price)}</p>
                  
                  {/* Subtotal per item */}
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Total: {formatPrice(item.price * item.quantity)}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-semibold text-sm w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.productId)}
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

      {/* Summary - Fixed at bottom */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <p className="text-xs text-muted-foreground">{totalItems} item</p>
              </div>
              <span className="font-bold text-xl text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <Link to="/buyer/checkout">
              <Button className="w-full gap-2 h-12 text-base shadow-md" size="lg">
                Lanjut ke Checkout
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </BuyerLayout>
  );
}

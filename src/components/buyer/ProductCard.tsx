import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  categoryName?: string;
}

export function ProductCard({ id, name, price, imageUrl, stock, categoryName }: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find(item => item.productId === id);
  const isOutOfStock = stock <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: id,
      name,
      price,
      imageUrl,
      stock,
    });
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      isOutOfStock && "opacity-60"
    )}>
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">Stok Habis</span>
          </div>
        )}
        {categoryName && (
          <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full">
            {categoryName}
          </span>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>
        <p className="text-primary font-bold mt-1">{formatPrice(price)}</p>
        <p className="text-xs text-muted-foreground mt-1">Stok: {stock}</p>
        
        <div className="mt-3">
          {cartItem ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(id, cartItem.quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-medium text-sm">{cartItem.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(id, cartItem.quantity + 1)}
                disabled={cartItem.quantity >= stock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="w-4 h-4" />
              Tambah
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

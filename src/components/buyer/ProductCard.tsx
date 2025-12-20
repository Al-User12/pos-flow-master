import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
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
  const { items, addItem, updateQuantity } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
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
    if (isOutOfStock || isAdding) return;
    
    setIsAdding(true);
    addItem({
      productId: id,
      name,
      price,
      imageUrl,
      stock,
    });
    
    toast({
      title: "Ditambahkan ke keranjang",
      description: name,
      duration: 2000,
    });
    
    setTimeout(() => setIsAdding(false), 500);
  };

  const showPlaceholder = !imageUrl || imageError;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      isOutOfStock && "opacity-60"
    )}>
      <div className="aspect-square relative bg-muted overflow-hidden">
        {showPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-12 h-12 text-muted-foreground/50" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground bg-background/90 px-3 py-1.5 rounded-full">
              Stok Habis
            </span>
          </div>
        )}
        {categoryName && !isOutOfStock && (
          <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            {categoryName}
          </span>
        )}
        {cartItem && !isOutOfStock && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md">
            {cartItem.quantity}
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[2.5rem] leading-tight">
          {name}
        </h3>
        <p className="text-primary font-bold mt-1.5 text-base">{formatPrice(price)}</p>
        <div className="flex items-center justify-between mt-1">
          <p className={cn(
            "text-xs",
            stock <= 5 && stock > 0 ? "text-warning font-medium" : "text-muted-foreground"
          )}>
            {stock <= 5 && stock > 0 ? `Sisa ${stock}` : `Stok: ${stock}`}
          </p>
        </div>
        
        <div className="mt-3">
          {cartItem ? (
            <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md hover:bg-background"
                onClick={() => updateQuantity(id, cartItem.quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-sm min-w-[2rem] text-center">
                {cartItem.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md hover:bg-background"
                onClick={() => updateQuantity(id, cartItem.quantity + 1)}
                disabled={cartItem.quantity >= stock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              className={cn(
                "w-full gap-2 transition-all",
                isAdding && "bg-primary/80"
              )}
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
            >
              {isAdding ? (
                <>
                  <Check className="w-4 h-4" />
                  Ditambahkan
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Tambah
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
